export async function apiFetchAluno(input: RequestInfo | URL, init?: RequestInit) {
  const alunoId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_aluno_id")
      : null;

  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_aluno_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});

  if (alunoId) headers.set("x-aluno-id", alunoId);
  if (academiaId) headers.set("x-academia-id", academiaId);

  return fetch(input, {
    ...init,
    headers,
  });
}