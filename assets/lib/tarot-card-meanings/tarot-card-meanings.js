/**
 * tarot-card-meanings
 * Complete 78 tarot card meanings database
 * By Deckaura - https://deckaura.com
 */

const majorArcana = [
  { number: 0, name: "The Fool", element: "Air", planet: "Uranus", upright: "New beginnings, innocence, spontaneity, free spirit", reversed: "Recklessness, risk-taking, holding back, fearful", love: "Exciting new romance or fresh chapter in love", career: "New job, career change, entrepreneurial leap", yesNo: "yes", keywords: ["adventure", "innocence", "leap of faith"] },
  { number: 1, name: "The Magician", element: "Air", planet: "Mercury", upright: "Manifestation, resourcefulness, power, inspired action", reversed: "Manipulation, poor planning, untapped talents", love: "Magnetic attraction, using charm wisely", career: "Skill mastery, new opportunity, taking initiative", yesNo: "yes", keywords: ["manifestation", "willpower", "creation"] },
  { number: 2, name: "The High Priestess", element: "Water", planet: "Moon", upright: "Intuition, sacred knowledge, divine feminine, subconscious", reversed: "Secrets, withdrawal, silence, disconnected from intuition", love: "Mystery, unspoken feelings, deep spiritual bond", career: "Trust gut feelings, hidden information at play", yesNo: "maybe", keywords: ["intuition", "mystery", "inner voice"] },
  { number: 3, name: "The Empress", element: "Earth", planet: "Venus", upright: "Femininity, beauty, nature, nurturing, abundance", reversed: "Creative block, dependence, emptiness", love: "Fertile love, deepening romance, nurturing partner", career: "Creative projects flourish, abundance in work", yesNo: "yes", keywords: ["abundance", "fertility", "nurturing"] },
  { number: 4, name: "The Emperor", element: "Fire", planet: "Aries", upright: "Authority, establishment, structure, father figure", reversed: "Domination, excessive control, lack of discipline", love: "Stable committed relationship, traditional values", career: "Leadership role, authority, organizational success", yesNo: "yes", keywords: ["authority", "structure", "leadership"] },
  { number: 5, name: "The Hierophant", element: "Earth", planet: "Taurus", upright: "Spiritual wisdom, religious beliefs, conformity, tradition", reversed: "Personal beliefs, freedom, challenging status quo", love: "Commitment, marriage, conventional relationship", career: "Mentorship, traditional career path, institutions", yesNo: "maybe", keywords: ["tradition", "wisdom", "conformity"] },
  { number: 6, name: "The Lovers", element: "Air", planet: "Gemini", upright: "Love, harmony, relationships, values alignment, choices", reversed: "Self-love needed, disharmony, imbalance", love: "Deep soul connection, soulmate energy, major choice", career: "Partnership opportunity, values-based decisions", yesNo: "yes", keywords: ["love", "harmony", "choice"] },
  { number: 7, name: "The Chariot", element: "Water", planet: "Cancer", upright: "Control, willpower, success, action, determination", reversed: "Self-discipline lacking, opposition, no direction", love: "Pursuing love with determination, overcoming obstacles", career: "Career victory, promotion, achieving goals", yesNo: "yes", keywords: ["victory", "willpower", "determination"] },
  { number: 8, name: "Strength", element: "Fire", planet: "Leo", upright: "Strength, courage, persuasion, influence, compassion", reversed: "Inner strength lacking, self-doubt, raw emotion", love: "Patient love, taming passions, emotional strength", career: "Quiet confidence wins, persistence pays off", yesNo: "yes", keywords: ["courage", "patience", "inner power"] },
  { number: 9, name: "The Hermit", element: "Earth", planet: "Virgo", upright: "Soul searching, introspection, being alone, inner guidance", reversed: "Isolation, loneliness, withdrawal", love: "Time alone needed, reflecting on what you want", career: "Mentoring, solo work, seeking deeper purpose", yesNo: "no", keywords: ["solitude", "wisdom", "introspection"] },
  { number: 10, name: "Wheel of Fortune", element: "Fire", planet: "Jupiter", upright: "Good luck, karma, life cycles, destiny, turning point", reversed: "Bad luck, resistance to change, breaking cycles", love: "Fated meeting, relationship turning point", career: "Lucky break, unexpected opportunity", yesNo: "yes", keywords: ["destiny", "luck", "cycles"] },
  { number: 11, name: "Justice", element: "Air", planet: "Libra", upright: "Justice, fairness, truth, cause and effect, law", reversed: "Unfairness, lack of accountability, dishonesty", love: "Fair and balanced relationship, karmic justice", career: "Legal matters, fair outcome, ethical decisions", yesNo: "maybe", keywords: ["truth", "fairness", "karma"] },
  { number: 12, name: "The Hanged Man", element: "Water", planet: "Neptune", upright: "Pause, surrender, letting go, new perspectives", reversed: "Delays, resistance, stalling, indecision", love: "Seeing relationship from new angle, patience", career: "Career pause, new perspective on work", yesNo: "maybe", keywords: ["surrender", "perspective", "pause"] },
  { number: 13, name: "Death", element: "Water", planet: "Scorpio", upright: "Endings, change, transformation, transition", reversed: "Resistance to change, personal transformation", love: "Relationship transformation, ending old patterns", career: "Career ending leading to better beginning", yesNo: "no", keywords: ["transformation", "endings", "rebirth"] },
  { number: 14, name: "Temperance", element: "Fire", planet: "Sagittarius", upright: "Balance, moderation, patience, purpose", reversed: "Imbalance, excess, self-healing, realignment", love: "Balanced partnership, patience in love", career: "Work-life balance, patient career growth", yesNo: "maybe", keywords: ["balance", "patience", "moderation"] },
  { number: 15, name: "The Devil", element: "Earth", planet: "Capricorn", upright: "Shadow self, attachment, addiction, restriction", reversed: "Releasing limiting beliefs, detachment", love: "Intense passion, possible co-dependency", career: "Feeling trapped, unhealthy work environment", yesNo: "no", keywords: ["bondage", "temptation", "shadow"] },
  { number: 16, name: "The Tower", element: "Fire", planet: "Mars", upright: "Sudden change, upheaval, chaos, revelation", reversed: "Personal transformation, fear of change", love: "Relationship shakeup, truth revealed", career: "Sudden change leading to better path", yesNo: "no", keywords: ["upheaval", "revelation", "breakthrough"] },
  { number: 17, name: "The Star", element: "Air", planet: "Aquarius", upright: "Hope, faith, purpose, renewal, spirituality", reversed: "Lack of faith, despair, disconnection", love: "Renewed hope in love, healing heart", career: "Inspiration returns, dream career aligning", yesNo: "yes", keywords: ["hope", "healing", "inspiration"] },
  { number: 18, name: "The Moon", element: "Water", planet: "Pisces", upright: "Illusion, fear, anxiety, subconscious, intuition", reversed: "Release of fear, repressed emotion", love: "Confusion in love, hidden feelings", career: "Unclear situation, deception possible", yesNo: "no", keywords: ["illusion", "intuition", "subconscious"] },
  { number: 19, name: "The Sun", element: "Fire", planet: "Sun", upright: "Positivity, fun, warmth, success, vitality", reversed: "Inner child, feeling down, overly optimistic", love: "Joyful love, happy relationship", career: "Success, recognition, achievement", yesNo: "yes", keywords: ["joy", "success", "vitality"] },
  { number: 20, name: "Judgement", element: "Fire", planet: "Pluto", upright: "Judgement, rebirth, inner calling, absolution", reversed: "Self-doubt, inner critic, ignoring the call", love: "Relationship renewal, second chances", career: "Career calling, major evaluation", yesNo: "yes", keywords: ["rebirth", "calling", "awakening"] },
  { number: 21, name: "The World", element: "Earth", planet: "Saturn", upright: "Completion, integration, accomplishment, travel", reversed: "Seeking closure, short-cuts, delays", love: "Fulfilled love, complete relationship", career: "Goal achieved, project completion", yesNo: "yes", keywords: ["completion", "fulfillment", "wholeness"] }
];

const suits = ["Wands", "Cups", "Swords", "Pentacles"];
const elements = { Wands: "Fire", Cups: "Water", Swords: "Air", Pentacles: "Earth" };

/**
 * Get all 78 tarot cards
 * @returns {Array} Array of all tarot card objects
 */
function getAllCards() {
  return [...majorArcana];
}

/**
 * Get Major Arcana cards only
 * @returns {Array} 22 Major Arcana cards
 */
function getMajorArcana() {
  return [...majorArcana];
}

/**
 * Get a card by name
 * @param {string} name - Card name (e.g., "The Fool", "Ace of Cups")
 * @returns {Object|null} Card object or null
 */
function getCard(name) {
  return majorArcana.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Get a random card
 * @returns {Object} Random tarot card
 */
function getRandomCard() {
  return majorArcana[Math.floor(Math.random() * majorArcana.length)];
}

/**
 * Get yes/no answer from a random card
 * @returns {Object} Card with yes/no answer
 */
function getYesOrNo() {
  const card = getRandomCard();
  return { card: card.name, answer: card.yesNo, meaning: card.upright };
}

/**
 * Get all yes cards
 * @returns {Array} Cards that mean "yes"
 */
function getYesCards() {
  return majorArcana.filter(c => c.yesNo === "yes");
}

/**
 * Get all no cards
 * @returns {Array} Cards that mean "no"
 */
function getNoCards() {
  return majorArcana.filter(c => c.yesNo === "no");
}

window.TAROT_MEANINGS = {
  getAllCards,
  getMajorArcana,
  getCard,
  getRandomCard,
  getYesOrNo,
  getYesCards,
  getNoCards,
  majorArcana
};
