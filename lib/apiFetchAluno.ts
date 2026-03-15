export async function apiFetchAluno(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  let alunoId = null;
  let academiaId = null;

  if (typeof window !== "undefined") {
    alunoId =
      localStorage.getItem("treinoprint_app_aluno_id") ||
      localStorage.getItem("treinoprint_aluno_id");

    academiaId =
      localStorage.getItem("treinoprint_app_academia_id") ||
      localStorage.getItem("treinoprint_aluno_academia_id") ||
      localStorage.getItem("treinoprint_academia_id");
  }

  const headers = new Headers(init?.headers || {});

  if (alunoId) {
    headers.set("x-aluno-id", alunoId);
    headers.set("x-app-aluno-id", alunoId);
  }

  if (academiaId) {
    headers.set("x-academia-id", academiaId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}