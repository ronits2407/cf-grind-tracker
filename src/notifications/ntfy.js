export async function sendNtfyNotification(topic, title, body, url = null) {
  if (!topic) return;
  const headers = {
    'Title': title,
    'Priority': 'default'
  };
  
  if (url) {
    headers['Click'] = url;
  }

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      body: body,
      headers: headers
    });
  } catch (error) {
    console.error('Failed to send ntfy notification', error);
  }
}
