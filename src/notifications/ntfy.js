export async function sendNtfyNotification(topic, title, body, url = null, token = null) {
  if (!topic) return;
  const headers = {
    'Title': title,
    'Priority': 'default'
  };
  
  if (url) {
    headers['Click'] = url;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
