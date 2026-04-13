export function getSavedUser() {
  try {
    const saved = localStorage.getItem("startupreneur_user");
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function saveUser(userData) {
  localStorage.setItem("startupreneur_user", JSON.stringify(userData));
}

export function clearSavedUser() {
  localStorage.removeItem("startupreneur_user");
}