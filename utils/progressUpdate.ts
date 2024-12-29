export async function updateUserProgress(firebaseUid: string, progressData: any) {
  try {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid,
        progress: progressData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update progress');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
} 