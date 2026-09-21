import { isApiError } from "~/infrastructure/api/errors";
import { setSession, type Role } from "~/infrastructure/session/session-store";

export interface OwnerLoginResult {
  access: string;
  refresh: string;
  userId: number;
  fullName: string;
  role: Role;
}

export interface OwnerAuthRepository {
  login: (login: string, password: string) => Promise<OwnerLoginResult>;
}

export type SignInOwnerResult =
  | { status: "success" }
  | { status: "invalid_credentials" }
  | { status: "offline" };

export async function signInOwner(
  repo: OwnerAuthRepository,
  login: string,
  password: string,
  remember: boolean,
): Promise<SignInOwnerResult> {
  try {
    const result = await repo.login(login, password);
    setSession(
      {
        role: result.role,
        accessToken: result.access,
        refreshToken: result.refresh,
        userId: result.userId,
        fullName: result.fullName,
      },
      remember,
    );
    return { status: "success" };
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      return { status: "invalid_credentials" };
    }
    if (error instanceof TypeError) {
      return { status: "offline" };
    }
    throw error;
  }
}
