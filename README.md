Auto-reply AI (Hugging Face, free-first strategy)

Mục tiêu: chạy bằng dịch vụ miễn phí hoặc fallback hoàn toàn free khi token không có.

Hướng dẫn cài đặt nhanh:

1) (Tùy chọn) Tạo secret HF_API_TOKEN trong Settings → Secrets and variables → Actions của repository bằng token từ https://huggingface.co/settings/tokens. Token có free tier. Nếu không tạo token, bot sẽ sử dụng phản hồi fallback (mẫu ngắn), hoàn toàn không tốn phí.

2) Nhánh scaffold: assistant/auto-reply
3) Workflow: .github/workflows/auto-reply.yml — lắng nghe sự kiện issue_comment và pull_request_review_comment.
4) Cách trigger bot:
   - Thêm một comment có `/ask-bot` trong nội dung, hoặc
   - Mention bot: `@hoanganhkm352-pixel` trong comment.

Chi tiết hành vi:
- Mặc định model HF: EleutherAI/gpt-neo-125M (nhẹ, free-friendly). Bạn có thể đổi model bằng biến môi trường HF_MODEL trong workflow.
- Nếu HF_API_TOKEN không được cung cấp hoặc HF API trả lỗi, bot sẽ đăng một phản hồi fallback bằng tiếng Việt (tuyên bố đã nhận được yêu cầu).
- Có rate-limit cơ bản: bot sẽ không trả lời nếu họ đã trả lời cùng issue/PR trong vòng 10 phút trước đó.

Lưu ý:
- Một số model trên Hugging Face có chất lượng tiếng Việt khác nhau; EleutherAI/gpt-neo-125M là lựa chọn nhẹ nhưng có giới hạn về chất lượng. Bạn có thể thử các model khác miễn phí.
- Kiểm soát spam: workflow hiện trigger khi có comment mới; nếu muốn an toàn hơn, chuyển sang chỉ trigger khi có `/ask-bot` (hiện đang dùng cả trigger và check nội dung). Bạn có thể yêu cầu mình giới hạn chỉ slash command.

Bạn muốn mình tạo PR từ nhánh assistant/auto-reply vào branch mặc định không? Trả lời: “Tạo PR” để mình mở PR, hoặc “Không” để chỉ commit trên nhánh.
