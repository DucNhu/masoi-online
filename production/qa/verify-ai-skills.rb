#!/usr/bin/env ruby
# Read-only Codex-profile verification; no file writes or installed dependencies.
Encoding.default_external = Encoding::UTF_8
require 'json'
require 'yaml'
require 'pathname'

ROOT = Pathname.new(__dir__).join('../..').realpath
INVENTORY = ROOT.join('production/planning/ai-skill-inventory.json')
NATIVE_KEYS = %w[name description license allowed-tools metadata].freeze
LEGACY_TOOLS = %w[Read Write Edit Glob Grep Bash RunCommand WebSearch WebFetch AskUserQuestion Task TodoWrite Skill].freeze

def frontmatter(text)
  match = text.match(/\A---\r?\n(.*?)\r?\n---(?:\r?\n|\z)/m)
  raise 'missing YAML frontmatter' unless match
  [YAML.safe_load(match[1], aliases: false), text[match.end(0)..]]
end

def native_errors(name, fm, body)
  errors = []
  return ['frontmatter must be a mapping'] unless fm.is_a?(Hash)
  errors << 'unsupported top-level fields' unless (fm.keys - NATIVE_KEYS).empty?
  errors << 'name mismatch/invalid' unless fm['name'] == name && name.match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/) && name.length <= 64
  description = fm['description']
  errors << 'invalid description' unless description.is_a?(String) && !description.strip.empty? && description.length <= 1024 && !description.match?(/[<>]/)
  tools = fm['allowed-tools']
  errors << 'missing/advisory tool list' unless tools.is_a?(String) && !tools.strip.empty?
  errors << 'legacy callable tool alias in frontmatter' if tools.is_a?(String) && tools.split(/[,\s]+/).any? { |tool| LEGACY_TOOLS.include?(tool) }
  metadata = fm['metadata']
  errors << 'metadata must be a string mapping' unless metadata.is_a?(Hash) && metadata.all? { |k, v| k.is_a?(String) && v.is_a?(String) }
  errors << 'missing argument hint metadata' unless metadata.is_a?(Hash) && metadata['argument-hint'].is_a?(String) && !metadata['argument-hint'].strip.empty?
  errors << 'missing explicit invocation metadata' unless metadata.is_a?(Hash) && metadata['user-invocable'] == 'true'
  errors << 'fewer than two workflow sections' if body.scan(/^##\s+\S/).length < 2
  errors << 'missing evidence verdicts' unless %w[PASS CONCERNS BLOCKED NOT\ RUN].all? { |word| body.include?(word.tr('\\', '')) }
  approval_before_write = body.lines.any? do |line|
    line.match?(/trước mutation|trước khi ghi|before writing|approval-before-write/i) &&
      line.match?(/approval|phê duyệt/i) && line.match?(/scope|path/i)
  end
  errors << 'missing approval-before-write contract' unless approval_before_write
  errors << 'missing next-step handoff' unless body.match?(/next.step|handoff|hành động tiếp theo/i)
  errors
end

def policy_errors(trigger, metadata)
  return [] if trigger == 'active' && (metadata.nil? || metadata.dig('policy', 'allow_implicit_invocation') != false)
  return ['active skill unexpectedly explicit-only'] if trigger == 'active'
  return ['implicit invocation not disabled'] unless metadata.is_a?(Hash) && metadata.dig('policy', 'allow_implicit_invocation') == false
  []
end

if ARGV == ['--self-test']
  # Counterexamples validate the checker, not the host's actual skill invocation.
  raise 'manual missing policy accepted' if policy_errors('manual', nil).empty?
  raise 'dormant true policy accepted' if policy_errors('dormant', {'policy'=>{'allow_implicit_invocation'=>true}}).empty?
  raise 'dormant false policy rejected' unless policy_errors('dormant', {'policy'=>{'allow_implicit_invocation'=>false}}).empty?
  raise 'active default rejected' unless policy_errors('active', nil).empty?
  raise 'invalid YAML unexpectedly parsed' unless begin frontmatter("---\nname: [broken\n---\nbody"); false; rescue Psych::SyntaxError; true; end
  raise 'legacy/invalid frontmatter accepted' if native_errors('sample', {'name'=>'other', 'description'=>'', 'allowed-tools'=>'Write'}, '').empty?
  puts JSON.pretty_generate({'verdict'=>'PASS', 'checker_counterexamples'=>6, 'host_behavior'=>'NOT RUN'})
  exit 0
end
abort 'usage: ruby production/qa/verify-ai-skills.rb [--self-test]' unless ARGV.empty?

inventory = JSON.parse(INVENTORY.read)
rows = inventory.fetch('skills')
actual = ROOT.join('.agents/skills').children.select { |p| p.join('SKILL.md').file? }.map { |p| p.basename.to_s }.sort
failures = []
counts = {'total'=>rows.length, 'template'=>rows.count { |r| r['kind']=='template' }, 'project'=>rows.count { |r| r['kind']=='project' }}
%w[active manual dormant].each { |mode| counts[mode] = rows.count { |r| r['trigger']==mode } }
failures << 'inventory/name coverage or duplicates' unless rows.map { |r| r['name'] }.sort == actual && rows.map { |r| r['name'] }.uniq.length == rows.length
failures << 'inventory declared counts differ from rows' unless counts == inventory['counts']
failures << 'expected 78 = 73 template + 5 project' unless counts.values_at('total','template','project') == [78,73,5]
agents = ROOT.join('AGENTS.md').read
%w[active manual dormant].each do |mode|
  line = agents.lines.find { |l| l.start_with?("  - `#{mode}`: ") }
  listed = line.to_s.split(': ',2)[1].to_s.split('. ',2)[0].strip.sub(/\.\z/, '').split(',').map(&:strip).sort
  failures << "AGENTS router mismatch #{mode}" unless listed == rows.select { |r| r['trigger']==mode }.map { |r| r['name'] }.sort
end

projects = []
policies = []
legacy = {}
rows.each do |row|
  begin
    name = row.fetch('name')
    path = ROOT.join(row.fetch('path'))
    parent = path.dirname
    raise 'unexpected logical path' unless row['path'] == ".agents/skills/#{name}/SKILL.md"
    raise 'unknown trigger' unless %w[active manual dormant].include?(row['trigger'])
    raise 'wrong owner kind' unless (parent.symlink? ? 'template' : 'project') == row['kind']
    raise 'target mismatch/outside repo' unless path.realpath.to_s == ROOT.join(row['target']).to_s && path.realpath.to_s.start_with?(ROOT.to_s + '/')
    fm, body = frontmatter(path.read)
    raise 'frontmatter/name mismatch' unless fm.is_a?(Hash) && fm['name']==name
    yaml_path = parent.join('agents/openai.yaml')
    metadata = yaml_path.file? ? YAML.safe_load(yaml_path.read, aliases: false) : nil
    policy_issues = policy_errors(row['trigger'], metadata)
    policies << {'name'=>name,'trigger'=>row['trigger'],'verdict'=>policy_issues.empty? ? 'PASS' : 'FAIL','issues'=>policy_issues}
    failures.concat(policy_issues.map { |issue| "#{name}: #{issue}" })
    if row['kind']=='project'
      issues = native_errors(name, fm, body)
      projects << {'name'=>name,'verdict'=>issues.empty? ? 'PASS' : 'FAIL','issues'=>issues}
      failures.concat(issues.map { |issue| "#{name}: #{issue}" })
    else
      tokens = (fm['allowed-tools'].to_s.split(/[,\s]+/) + body.scan(/\b(?:AskUserQuestion|TodoWrite|RunCommand|WebSearch|WebFetch|Task|Skill)\b/)).uniq
      legacy[name] = tokens.select { |t| LEGACY_TOOLS.include?(t) }
      unknown = fm['allowed-tools'].to_s.split(/[,\s]+/).reject { |t| t.empty? || LEGACY_TOOLS.include?(t) }
      failures << "#{name}: unmapped legacy frontmatter #{unknown.join(',')}" unless unknown.empty?
    end
  rescue StandardError => error
    failures << "#{row['name']}: #{error.class}: #{error.message}"
  end
end
mapped = legacy.values.flatten.uniq.sort
mapped.each { |tool| failures << "missing adapter #{tool}" unless agents.include?("`#{tool}`") }
result = {
  'profile'=>'Codex native frontmatter + adapted studio structure; not original Claude rubric',
  'counts'=>counts,
  'project_frontmatter_and_structure'=>projects,
  'invocation_policies'=>policies,
  'template_legacy_tool_aliases'=>mapped,
  'legacy_templates_with_aliases'=>legacy.count { |_name,tokens| !tokens.empty? },
  'adapter_check'=>'alias presence only; adapter meaning is reviewed separately by independent QA, not proven by this scanner',
  'failures'=>failures,
  'verdict'=>failures.empty? ? 'PASS' : 'FAIL',
  'unverified'=>['host reload/implicit invocation behavior', '78 workflow behavioral execution', 'original Claude spec/category coverage'],
  'compatibility_note'=>'73 template SKILL.md bodies remain legacy; runtime routing uses AGENTS adapter, not native host enforcement of allowed-tools'
}
puts JSON.pretty_generate(result)
exit(failures.empty? ? 0 : 1)
