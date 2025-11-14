namespace ChronoRead.Models;

public class ChronoNote
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AnchorParagraphId { get; set; } // 锚定到哪个 <p> (e.g., "p-1")
    public NoteType Type { get; set; } // "ai" or "user"
    public string Quote { get; set; } // 引用的原文
    public string SummaryText { get; set; } // 摘要第一条消息
    public List<ChatMessage> Messages { get; set; } = new();
    public double? PreciseTop { get; set; }

    // 状态 (用于 UI)
    public bool IsVisible { get; set; } = true;
    public bool IsExpanded { get; set; } = false;

    // 用于 JS 布局
    public string CssClass => $"timeline-card {Type.ToString().ToLower()} {(IsVisible ? "visible" : "")} {(IsExpanded ? "expanded" : "")}";
    public string MarkerCssClass => $"node-marker {Type.ToString().ToLower()} {(IsVisible ? "active" : "")}";
}

public class ChatMessage
{
    public NoteType Author { get; set; }
    public string Text { get; set; }
    public string CssClass => $"chat-bubble {(Author == NoteType.Ai ? "rag-answer" : "rag-question")}";
}

public enum NoteType
{
    Ai,
    User
}