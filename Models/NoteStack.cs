namespace ChronoRead.Models
{
    // "集合类" - 它管理一组笔记，但行为上像一个独立的项
    public class NoteStack : ITimelineItem
    {
        // 内部持有的笔记列表
        public List<ChronoNote> Notes { get; private set; } = new();

        // 方便 UI 获取当前应该显示在最上面的笔记
        public ChronoNote TopNote => Notes.OrderByDescending(n => n.StackOrder).First();

        // --- ITimelineItem 接口实现 ---
        public string Id { get; private set; }
        public NoteType Type { get; private set; }
        public double VerticalPosition { get; set; } // 这是整个堆叠的中心点
        public bool IsVisible { get; set; } = true;
        public bool IsExpanded { get; set; } = false;

        // CSS 类，'is-stack' 是一个新标记，用于 CSS
        public string CssClass => $"timeline-card {Type.ToString().ToLower()} {(IsVisible ? "visible" : "")} {(IsExpanded ? "expanded" : "")} is-stack";
        public string MarkerCssClass => $"node-marker {Type.ToString().ToLower()} {(IsVisible ? "active" : "")} is-stack";
        // --- 接口实现结束 ---

        public NoteStack(ChronoNote firstNote)
        {
            Id = $"stack-{firstNote.Id}"; // 堆叠ID基于第一个笔记
            Type = firstNote.Type;
            VerticalPosition = firstNote.VerticalPosition; // 初始位置
            firstNote.StackOrder = 1; // 设为第1
            Notes.Add(firstNote);
        }

        // 将一个新笔记添加到堆叠
        public void AddNote(ChronoNote newNote)
        {
            // 将新笔记的 StackOrder 设为最高
            newNote.StackOrder = Notes.Max(n => n.StackOrder) + 1;
            Notes.Add(newNote);

            // 关键：重新计算堆叠的垂直中心位置
            RecalculateVerticalCenter();
        }

        // 重新计算中心点 (您逻辑中的"垂直中心附近")
        public void RecalculateVerticalCenter()
        {
            // 使用所有笔记 *最初* 的划词位置 (VerticalPosition) 的平均值
            VerticalPosition = Notes.Average(n => n.VerticalPosition);
        }

        // 响应鼠标滚轮
        public void CycleNoteToTop(bool cycleForward)
        {
            if (Notes.Count < 2) return;

            if (cycleForward) // 向下滚 (DeltaY > 0), 显示 "下一张"
            {
                // 1. 找到当前最顶的卡片
                var currentTop = TopNote;
                // 2. 找到当前最底的卡片的 StackOrder
                var minOrder = Notes.Min(n => n.StackOrder);
                // 3. 把最顶的卡片放到最底 (比当前最低还低)
                currentTop.StackOrder = minOrder - 1;
            }
            else // 向上滚 (DeltaY < 0), 显示 "上一张"
            {
                // 1. 找到当前最底的卡片
                var currentBottom = Notes.OrderBy(n => n.StackOrder).First();
                // 2. 找到当前最顶的卡片的 StackOrder
                var maxOrder = Notes.Max(n => n.StackOrder);
                // 3. 把最底的卡片放到最顶 (比当前最高还高)
                currentBottom.StackOrder = maxOrder + 1;
            }
        }
    }
}