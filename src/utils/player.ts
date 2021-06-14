
/**
 * Utilities for players
 */

//https://gaming.stackexchange.com/a/21814
export const VALID_PLAYER_NAME_CHARS_STRING = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
export const VALID_PLAYER_NAME_CHARS = VALID_PLAYER_NAME_CHARS_STRING.split("");

/**Check if a player name is valid
 * 
 * @param name 
 * @returns 
 */
export function isValidPlayerName(name: string): boolean {
  let char;
  for (let i = 0; i < name.length; i++) {
    char = name.charAt(i);

    if (!VALID_PLAYER_NAME_CHARS.includes(char)) return false;
  }
  return true;
}
