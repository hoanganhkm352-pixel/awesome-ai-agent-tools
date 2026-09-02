const fs = require('fs');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

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

    // Build prompt for model (in Vietnamese)
    const prompt = `Bạn là một trợ lý lập trình bằng tiếng Việt. Trả lời ngắn gọn, lịch sự và rõ ràng cho nội dung sau:\n\n${commentBody}`;

    const hfToken = process.env.HF_API_TOKEN;
    if (!hfToken) {
      console.error('HF_API_TOKEN not set. Please add it to repository secrets.');
      process.exit(1);
    }

    const model = process.env.HF_MODEL || 'gpt2';
    const url = `https://api-inference.huggingface.co/models/${model}`;

    // Call Hugging Face Inference API
    const resp = await axios.post(url, { inputs: prompt, options: { wait_for_model: true } }, {
      headers: {
        Authorization: `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    // Response handling: HF may return array of generated items or object
    let reply = '';
    if (Array.isArray(resp.data)) {
      // models like text-generation return [{generated_text: '...'}]
      reply = resp.data.map(item => item.generated_text || '').join('\n').trim();
    } else if (typeof resp.data === 'object' && resp.data.generated_text) {
      reply = resp.data.generated_text;
    } else if (typeof resp.data === 'string') {
      reply = resp.data;
    } else {
      reply = JSON.stringify(resp.data);
    }

    if (!reply) {
      console.log('Model returned empty reply. Exiting.');
      return;
    }

    // Truncate reply if too long for GitHub comment
    if (reply.length > 6000) reply = reply.slice(0, 6000) + '\n\n*(truncated)*';

    // Post comment back to the issue/PR
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN not provided to workflow.');
      process.exit(1);
    }

    const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
    if (!owner || !repo || !issueNumber) {
      console.error('Repository or issue/PR number not available.');
      process.exit(1);
    }

    const octokit = new Octokit({ auth: githubToken });
    await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body: reply });

    console.log('Replied successfully.');
  } catch (err) {
    console.error('Error in auto-reply:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

main();
