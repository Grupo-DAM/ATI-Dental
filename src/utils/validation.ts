export const isValidEmail = (email: string): boolean => {
  // Optimized regex safe against ReDoS attacks
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};