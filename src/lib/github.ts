const API_ROOT = 'https://api.github.com';

export type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
};

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics?: string[];
};

async function requestGitHub<T>(path: string): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    let message = `GitHub returned an error (${response.status}).`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // Keep the status-based message when the response has no JSON body.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function fetchProfile(username: string) {
  return requestGitHub<GitHubProfile>(`/users/${encodeURIComponent(username)}`);
}

export function fetchUserRepositories(username: string) {
  return requestGitHub<GitHubRepository[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
  );
}

export async function searchRepositories(query: string) {
  const params = new URLSearchParams({ q: query, sort: 'stars', order: 'desc', per_page: '30' });
  const result = await requestGitHub<{ items: GitHubRepository[] }>(`/search/repositories?${params}`);
  return result.items;
}