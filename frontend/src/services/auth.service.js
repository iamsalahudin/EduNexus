export const mockLogin = async ({ email }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          id: 1,
          name: 'Admin User',
          role: 'admin',
        },
      });
    }, 1000);
  });
};
