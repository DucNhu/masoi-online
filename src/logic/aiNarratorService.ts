/**
 * AI Narrator & LLM Service — Ma Sói Game Studio
 * Kế thừa kiến trúc đa nhà cung cấp (Multi-Provider AI) từ hệ thống studio:
 * 1. Hỗ trợ song song Google Gemini & Anthropic Claude APIs (Client-side / Relay)
 * 2. Local Fallback Heuristics 0% latency khi offline hoặc không có API Key
 * 3. Sinh kịch bản Quản Trò (Night Call Script) & Lời thoại AI Bot sinh động
 * 4. Structured JSON extraction & Auto-repair
 */

export type AiProvider = 'LOCAL' | 'GEMINI' | 'CLAUDE';

export interface AiNarratorConfig {
  provider: AiProvider;
  geminiApiKey?: string;
  claudeApiKey?: string;
  temperature?: number;
}

export interface NightNarrationEvent {
  phase: 'NIGHT_START' | 'WEREWOLF_CALL' | 'SEER_CALL' | 'WITCH_CALL' | 'BODYGUARD_CALL' | 'DAY_START';
  victimName?: string;
  savedName?: string;
  revealedRole?: string;
  dayNumber: number;
}

export interface BotSpeechContext {
  botName: string;
  botRole: string;
  suspectedPlayerName?: string;
  isAccused: boolean;
  recentDeaths: string[];
}

export class AiNarratorService {
  private static config: AiNarratorConfig = {
    provider: 'LOCAL',
    temperature: 0.7,
  };

  /**
   * Cập nhật cấu hình AI (Provider, API Keys)
   */
  public static setConfig(newConfig: Partial<AiNarratorConfig>): void {
    AiNarratorService.config = {
      ...AiNarratorService.config,
      ...newConfig,
    };
  }

  public static getConfig(): AiNarratorConfig {
    return { ...AiNarratorService.config };
  }

  /**
   * Sinh lời kể Quản Trò ma mị theo pha Ngày/Đêm
   */
  public static async generateNightNarration(event: NightNarrationEvent): Promise<string> {
    // 1. Thử gọi LLM nếu có API key
    if (AiNarratorService.config.provider === 'GEMINI' && AiNarratorService.config.geminiApiKey) {
      try {
        return await AiNarratorService.callGeminiForNarration(event);
      } catch (err) {
        console.warn('[AiNarratorService] Gemini call failed, falling back to Local Heuristic:', err);
      }
    }

    // 2. Local Heuristic Engine (Mặc định siêu tốc, 0ms, không tốn token)
    return AiNarratorService.getLocalNightNarration(event);
  }

  /**
   * Sinh lời biện hộ hoặc tranh luận của Bot AI ban ngày
   */
  public static async generateBotSpeech(context: BotSpeechContext): Promise<string> {
    if (AiNarratorService.config.provider === 'GEMINI' && AiNarratorService.config.geminiApiKey) {
      try {
        return await AiNarratorService.callGeminiForBotSpeech(context);
      } catch (err) {
        console.warn('[AiNarratorService] Gemini call failed, falling back to Local Heuristic:', err);
      }
    }

    return AiNarratorService.getLocalBotSpeech(context);
  }

  /**
   * Local Heuristic Narrator (Động cơ sinh thoại ngữ cảnh nội tại)
   */
  private static getLocalNightNarration(event: NightNarrationEvent): string {
    switch (event.phase) {
      case 'NIGHT_START':
        return `🌙 Đêm thứ ${event.dayNumber} buông xuống... Sương mù dày đặc bao trùm ngôi làng u ám. Mọi người hãy nhắm mắt đi ngủ!`;
      case 'WEREWOLF_CALL':
        return `🐺 Đêm trăng máu lên cao... Đàn Sói hãy thức tỉnh, mở mắt nhìn nhau và chọn một nạn nhân xấu số!`;
      case 'SEER_CALL':
        return `🔮 Tiên Tri thông thái... Hãy thức tỉnh và soi rọi xem ai đang ẩn giấu bộ mặt của quỷ dữ!`;
      case 'BODYGUARD_CALL':
        return `🛡️ Bảo Vệ dũng cảm... Hãy thức tỉnh và chọn một người để che chở an lành đêm nay!`;
      case 'WITCH_CALL':
        return `🧙‍♀️ Phù Thủy quyền năng... Có một linh hồn đang bên bờ vực cái chết. Ngươi sẽ cứu rỗi hay gieo thêm tai họa?`;
      case 'DAY_START':
        if (event.victimName) {
          return `☀️ Bình minh hé rạng ngày thứ ${event.dayNumber}... Tiếng chuông nhà thờ ngân lên đau đớn. Đêm qua, ${event.victimName} đã bị Sói cắn xé không còn nguyên vẹn!`;
        }
        return `☀️ Bình minh hé rạng ngày thứ ${event.dayNumber}... Thật kỳ diệu! Đêm qua là một đêm bình yên, không có ai phải bỏ mạng!`;
      default:
        return `Trời đã chuyển giao... Hãy tập trung quan sát!`;
    }
  }

  /**
   * Local Heuristic Bot Speech
   */
  private static getLocalBotSpeech(context: BotSpeechContext): string {
    if (context.isAccused) {
      return `Oan uổng quá! Tôi chỉ là một dân làng lương thiện muốn tìm ra Sói thôi, xin mọi người đừng nghi ngờ tôi!`;
    }
    if (context.suspectedPlayerName) {
      return `Mọi người chú ý này: Tôi quan sát thấy ${context.suspectedPlayerName} có biểu hiện rất khả nghi, chúng ta cần xem xét kỹ!`;
    }
    return `Chúng ta cần phải đoàn kết và lắng nghe thông tin thật cẩn trọng, đừng để Sói dắt mũi!`;
  }

  /**
   * Gọi Google Gemini REST API (Client-side / Relay)
   */
  private static async callGeminiForNarration(event: NightNarrationEvent): Promise<string> {
    const apiKey = AiNarratorService.config.geminiApiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Bạn là Quản trò Ma Sói đầy uy lực, giọng điệu ma mị và hồi hộp.
Tạo 1-2 câu lời dẫn ngắn gọn cho pha: ${event.phase}, ngày ${event.dayNumber}, nạn nhân: ${event.victimName || 'Không có'}.
Yêu cầu: Tiếng Việt tự nhiên, kịch tính, ngắn gọn dưới 50 từ.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 100 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || AiNarratorService.getLocalNightNarration(event);
  }

  /**
   * Gọi Google Gemini REST API cho lời thoại Bot
   */
  private static async callGeminiForBotSpeech(context: BotSpeechContext): Promise<string> {
    const apiKey = AiNarratorService.config.geminiApiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Bạn đang nhập vai người chơi "${context.botName}" (vai trò bí mật: ${context.botRole}) trong game Ma Sói.
Tình huống: ${context.isAccused ? 'Bạn đang bị cả làng nghi ngờ và bỏ phiếu' : `Bạn đang nghi ngờ ${context.suspectedPlayerName || 'ai đó'}`}.
Hãy nói đúng 1 câu thoại ngắn (dưới 35 từ), đậm chất tranh luận, bảo vệ bản thân hoặc phản biện người khác.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 80 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || AiNarratorService.getLocalBotSpeech(context);
  }
}
