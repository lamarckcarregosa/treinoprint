export async function apiFetchAluno(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const alunoId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_app_aluno_id") ||
        localStorage.getItem("treinoprint_aluno_id") ||
        localStorage.getItem("aluno_id")
      : null;

  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_app_academia_id") ||
        localStorage.getItem("treinoprint_academia_id") ||
        localStorage.getItem("academia_id")
      : null;

  const headers = new Headers(init?.headers || {});

  if (alunoId) {
    headers.set("x-aluno-id", String(alunoId));
    headers.set("x-app-aluno-id", String(alunoId));
  }

  if (academiaId) {
    headers.set("x-academia-id", String(academiaId));
  }

  return fetch(input, {
    ...init,
    headers,
  });
}