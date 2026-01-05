
export function capitalizeFirstLetter(string) {
  // Return an empty string if the input is null, undefined, or empty
  if (!string) {
    return "";
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}