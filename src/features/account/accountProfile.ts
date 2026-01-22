import { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    email: string;
    isActivated: boolean;
  };
}

export const getAccountProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    // Dane użytkownika są już dostępne w req.user dzięki middleware authenticateToken
    const userProfile = {
      username: req.user.username,
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching account profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
