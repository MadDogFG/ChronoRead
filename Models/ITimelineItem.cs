namespace ChronoRead.Models
{
    // 这个接口允许我们在一个列表中同时持有 ChronoNote 和 NoteStack
    public interface ITimelineItem
    {
        // 无论是单个笔记还是堆叠，都有一个唯一的ID
        string Id { get; }

        // 属于 AI 侧还是 User 侧
        NoteType Type { get; }

        // 在时间轴上的垂直Y坐标
        // (对于 Note, 这是 PreciseTop; 对于 Stack, 这是 StackCenterTop)
        double VerticalPosition { get; set; }

        // UI 状态
        bool IsVisible { get; set; }
        bool IsExpanded { get; set; }

        // CSS 类 (由实现类自己提供)
        string CssClass { get; }
        string MarkerCssClass { get; }
    }
}