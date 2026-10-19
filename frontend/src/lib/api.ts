const API_URL = "http://localhost:8000";

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role: string;
}) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function uploadPortfolioItem(data: {
  category: string;
  title: string;
  description: string;
  file: File;
  token: string;
}) {
  const formData = new FormData();
  formData.append("category", data.category);
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("file", data.file);

  const res = await fetch(`${API_URL}/api/portfolio/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${data.token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function getMyPortfolio(token: string) {
  const res = await fetch(`${API_URL}/api/portfolio/my-portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export async function getProfile(username: string) {
  const res = await fetch(`${API_URL}/api/profile/${username}`);
  if (!res.ok) throw new Error("Profile not found");
  return res.json();
}

export async function getMyProfile(token: string) {
  const res = await fetch(`${API_URL}/api/profile/me/info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function runProfileAnalysis(token: string) {
  const res = await fetch(`${API_URL}/api/analysis/run-profile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to generate report");
  }
  return res.json();
}

export async function runAnalysis(portfolioId: number, token: string) {
  const res = await fetch(`${API_URL}/api/analysis/run/${portfolioId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function searchTalent(data: {
  query?: string;
  role?: string;
  skills?: string[];
  min_experience?: number;
  max_experience?: number;
  location?: string;
}) {
  const res = await fetch(`${API_URL}/api/matching/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function updateProfile(
  data: {
    bio?: string;
    skills?: string;
    experience_years?: number;
    location?: string;
  },
  token: string
) {
  const res = await fetch(`${API_URL}/api/profile/me/update`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function rateUser(username: string, stars: number, token: string) {
  const res = await fetch(`${API_URL}/api/rating/${username}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stars }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Rating failed");
  }
  return res.json();
}

export async function uploadProfilePicture(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/profile/me/upload-picture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload picture");
  return res.json();
}

export async function getConversations(token: string) {
  const res = await fetch(`${API_URL}/api/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json();
}

export async function getMessageHistory(otherUserId: number, token: string) {
  const res = await fetch(`${API_URL}/api/chat/messages/${otherUserId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export function connectChatSocket(token: string) {
  return new WebSocket(`ws://localhost:8000/api/chat/ws?token=${token}`);
}

export function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ? parseInt(payload.sub) : null;
  } catch {
    return null;
  }
}

export async function getNotifications(token: string) {
  const res = await fetch(`${API_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function getUnreadCount(token: string) {
  const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch unread count");
  return res.json();
}

export async function markAllNotificationsRead(token: string) {
  const res = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to mark notifications read");
  return res.json();
}

export async function verifyEmail(email: string, code: string) {
  const res = await fetch(`${API_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Verification failed");
  }
  return res.json();
}

export async function resendCode(email: string) {
  const res = await fetch(`${API_URL}/api/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Could not resend the code");
  }
  return res.json();
}

export async function getShortlist(token: string) {
  const res = await fetch(`${API_URL}/api/shortlist`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch shortlist");
  return res.json();
}

export async function getShortlistUsernames(token: string) {
  const res = await fetch(`${API_URL}/api/shortlist/usernames`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch shortlist");
  return res.json();
}

export async function addToShortlist(username: string, token: string) {
  const res = await fetch(`${API_URL}/api/shortlist/${username}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Could not shortlist");
  }
  return res.json();
}

export async function removeFromShortlist(username: string, token: string) {
  const res = await fetch(`${API_URL}/api/shortlist/${username}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not remove from shortlist");
  return res.json();
}

export async function getJobs(token: string, q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`${API_URL}/api/jobs${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
}

export async function getMyJobs(token: string) {
  const res = await fetch(`${API_URL}/api/jobs/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch your jobs");
  return res.json();
}

export async function createJob(
  data: {
    title: string;
    description: string;
    role_needed: string;
    location?: string;
    skills?: string;
    job_type: string;
  },
  token: string
) {
  const res = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Could not post the job");
  }
  return res.json();
}

export async function applyToJob(jobId: number, message: string, token: string) {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Could not apply");
  }
  return res.json();
}

export async function getJobApplicants(jobId: number, token: string) {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/applicants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch applicants");
  return res.json();
}

export async function updateApplicationStatus(
  applicationId: number,
  status: string,
  token: string
) {
  const res = await fetch(`${API_URL}/api/jobs/applications/${applicationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Could not update the application");
  return res.json();
}

export async function toggleJobOpen(jobId: number, token: string) {
  const res = await fetch(`${API_URL}/api/jobs/${jobId}/toggle-open`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Could not update the job");
  return res.json();
}
