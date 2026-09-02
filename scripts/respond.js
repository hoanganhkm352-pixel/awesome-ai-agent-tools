const fs = require('fs');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

function minutesBetween(a, b) {
  return Math.abs((new Date(a) - new Date(b)) / 60000);
}

async function callHuggingFace(model, prompt, hfToken) {
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const resp = await axios.post(url, { inputs: prompt, options: { wait_for_model: true } }, {
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json'
    },
    timeout: 120000
  });
  // Handle different response shapes
  if (Array.isArray(resp.data)) {
    return resp.data.map(item => item.generated_text || item[0] || '').join('\n').trim();
  } else if (typeof resp.data === 'object' && resp.data.generated_text) {
    return resp.data.generated_text;
  } else if (typeof resp.data === 'string') {
    return resp.data;
  } else {
    return JSON.stringify(resp.data);
  }
}

async function main() {
  try {
    const eventPath = process.env.GITHUB_EVENT_PATH;
    if (!eventPath) {
      console.log('GITHUB_EVENT_PATH not set. Exiting.');
      return;
    }

    const raw = fs.readFileSync(eventPath, 'utf8');
    const event = JSON.parse(raw);

    // Determine comment text and target issue/PR number
    let commentBody = '';
    let issueNumber = null;

    if (event.comment) {
      commentBody = event.comment.body || '';
      issueNumber = (event.issue && event.issue.number) || (event.pull_request && event.pull_request.number) || null;
    } else if (event.review) {
      commentBody = event.review.body || '';
      issueNumber = (event.pull_request && event.pull_request.number) || null;
    } else {
      console.log('Event has no comment or review. Nothing to do.');
      return;
    }

    const botUsername = process.env.BOT_USERNAME || 'hoanganhkm352-pixel';

    // Trigger rules: contains /ask-bot or mentions bot
    const triggered = commentBody.includes('/ask-bot') || commentBody.includes(`@${botUsername}`);
    if (!triggered) {
      console.log('No trigger found in comment. Exiting.');
      return;
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    if (!owner || !repo || !issueNumber) {
      console.error('Repository or issue/PR number not available.');
      process.exit(1);
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN not provided to workflow.');
      process.exit(1);
    }

    const octokit = new Octokit({ auth: githubToken });

    // Rate-limit: don't reply if bot already replied in last 10 minutes on this issue/PR
    try {
      const comments = await octokit.issues.listComments({ owner, repo, issue_number: issueNumber });
      const botComments = comments.data.filter(c => c.user && c.user.login === botUsername);
      if (botComments.length > 0) {
        const last = botComments[botComments.length - 1];
        const minutes = minutesBetween(last.created_at, new Date());
        if (minutes < 10) {
          console.log(`Bot already replied ${minutes.toFixed(1)} minutes ago. Skipping.`);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not check previous comments for rate-limit, continuing. Error:', e.message);
    }

    // Build prompt for model (in Vietnamese)
    const prompt = `Bạn là một trợ lý lập trình bằng tiếng Việt. Trả lời ngắn gọn, lịch sự và rõ ràng cho nội dung sau:\n\n${commentBody}`;

    const hfToken = process.env.HF_API_TOKEN;
    const model = process.env.HF_MODEL || 'EleutherAI/gpt-neo-125M';

    let reply = '';

    if (!hfToken) {
      console.log('No HF_API_TOKEN provided. Using fallback template.');
      reply = 'Cảm ơn bạn — mình đã nhận được câu hỏi. Mình sẽ xem xét và phản hồi sớm.';
    } else {
      try {
        reply = await callHuggingFace(model, prompt, hfToken);
        if (!reply || reply.trim().length === 0) {
          console.log('Model returned empty response. Using fallback.');
          reply = 'Cảm ơn bạn — mình đã nhận được câu hỏi. Mình sẽ xem xét và phản hồi sớm.';
        }
      } catch (err) {
        console.error('Hugging Face API error:', err.response ? err.response.data : err.message);
        reply = 'Cảm ơn bạn — hiện tại không thể tạo câu trả lời tự động. Mình sẽ xem xét và phản hồi sớm.';
      }
    }

    // Truncate reply if too long for GitHub comment
    if (reply.length > 6000) reply = reply.slice(0, 6000) + '\n\n*(truncated)*';

    await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body: reply });
    console.log('Replied successfully.');
  } catch (err) {
    console.error('Error in auto-reply:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

main();
