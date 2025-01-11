import { customAlphabet } from "nanoid/non-secure";
import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AssistantCloud } from "@assistant-ui/react";

export const generateId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7,
);
const randomUserId = () => {
  const userId = "usr_anon_" + generateId(32);
  return userId;
};

const getJwtForNewUser = () => {
  const userId = randomUserId();
  const token = jwt.sign({ sub: userId }, process.env["JWT_SECRET"]!);
  return { token, userId };
};

const getUserIdFromJwt = (token: string) => {
  const decoded = jwt.verify(token, process.env["JWT_SECRET"]!) as JwtPayload;
  return decoded.sub!;
};

export const POST = async () => {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt");
  let userId;
  if (!jwt) {
    // create a new anonymous user
    const { userId: newUserId, token } = getJwtForNewUser();
    cookieStore.set("jwt", token, { path: "/" });
    userId = newUserId;
  } else {
    userId = getUserIdFromJwt(jwt.value);
  }
  const client = new AssistantCloud({
    apiKey: process.env["ASSISTANT_API_KEY"]!,
    workspaceId: userId,
  });
  const { token } = await client.auth.tokens.create();
  return Response.json({ token });
};
