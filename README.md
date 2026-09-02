Auto-reply AI

Hướng dẫn nhanh:

1) Tạo secret OPENAI_API_KEY trong Settings → Secrets của repository (Value = khóa API OpenAI của bạn).
2) Nhánh scaffold: assistant/auto-reply
3) Workflow: .github/workflows/auto-reply.yml — lắng nghe sự kiện issue_comment và pull_request_review_comment.
4) Cách trigger bot:
   - Thêm một comment có `/ask-bot` trong nội dung, hoặc
   - Mention bot: `@hoanganhkm352-pixel` trong comment.

Hành vi:
- Khi workflow kích hoạt, nó sẽ gọi OpenAI (model gpt-3.5-turbo) để tạo câu trả lời bằng tiếng Việt và đăng một comment trả lời trên issue/PR.

Lưu ý bảo mật:
- Không commit khóa API vào mã nguồn. Luôn lưu OPENAI_API_KEY vào GitHub Secrets.

Bạn muốn mình tiếp tục và tạo PR từ nhánh này vào branch mặc định không? Hoặc chỉnh sửa trigger/behavior (ví dụ chỉ slash command, hoặc thêm limit rate)?
