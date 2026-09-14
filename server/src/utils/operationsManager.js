export const DEFAULT_OPERATIONS_MANAGER_EMAIL = "malaikaraffique@gmail.com";

export const getOperationsManagerEmail = () =>
  String(process.env.OPERATIONS_MANAGER_EMAIL || DEFAULT_OPERATIONS_MANAGER_EMAIL)
    .trim()
    .toLowerCase();

export const isOperationsManagerEmail = (email) =>
  String(email || "").trim().toLowerCase() === getOperationsManagerEmail();

export const isOperationsManagerAccount = (user) =>
  Boolean(user?.isActive && user?.role === "operations_manager" && isOperationsManagerEmail(user.email));
