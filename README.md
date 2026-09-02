Auto-reply AI (Hugging Face)

Hướng dẫn nhanh:

1) Tạo secret HF_API_TOKEN trong Settings → Secrets and variables → Actions của repository (Value = Hugging Face API token). Token có thể là token free-tier từ https://huggingface.co/settings/tokens.
2) Nhánh scaffold: assistant/auto-reply
3) Workflow: .github/workflows/auto-reply.yml — lắng nghe sự kiện issue_comment và pull_request_review_comment.
4) Cách trigger bot:
   - Thêm một comment có `/ask-bot` trong nội dung, hoặc
   - Mention bot: `@hoanganhkm352-pixel` trong comment.

Hành vi:
- Khi workflow kích hoạt, nó sẽ gọi Hugging Face Inference API (mặc định model: gpt2) để tạo câu trả lời bằng tiếng Việt và đăng một comment trả lời trên issue/PR.
- Bạn có thể thay đổi model bằng biến môi trường HF_MODEL trong workflow (ví dụ: 'gpt2', 'bigscience/bloom'...) — lưu ý một số model không hỗ trợ text-generation tốt hoặc cần nhiều tài nguyên.

Lưu ý:
- Hugging Face có free tier nhưng vẫn có giới hạn. Chọn model phù hợp để cân bằng chi phí/hiệu năng.
- Nếu model bạn chọn không hỗ trợ text generation hoặc cần xác thực khác, xử lý có thể khác nhau.
- Để tránh spam, cân nhắc giới hạn tần suất, kiểm soát nội dung, hoặc yêu cầu slash command để bot trả lời.

Bạn muốn mình cập nhật model mặc định (hiện là gpt2) hoặc thay đổi trigger (chỉ slash command)? Trả lời ngắn: “Đổi model: <model-name>” hoặc “Chỉ slash command”.
