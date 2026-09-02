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

    // Build prompt for OpenAI (in Vietnamese)
    const prompt = `Bạn là một trợ lý lập trình bằng tiếng Việt. Trả lời ngắn gọn, lịch sự và rõ ràng cho nội dung sau:\n\n${commentBody}`;

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not set. Please add it to repository secrets.');
      process.exit(1);
    }

    // Call OpenAI Chat Completion API
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.2
    }, {
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const reply = (resp.data && resp.data.choices && resp.data.choices[0] && resp.data.choices[0].message && resp.data.choices[0].message.content) || '';

    if (!reply) {
      console.log('OpenAI returned empty reply. Exiting.');
      return;
    }

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
