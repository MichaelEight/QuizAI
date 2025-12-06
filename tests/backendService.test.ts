// import { checkOpenAnswer } from "../src/backendService";

// Make actual unit tests (with mocked api)

// Temporarily allow making actual API calls for tests
// describe("checkOpenAnswer - actual API", () => {
//   it("should return a number when apiCheckOpenAnswer resolves successfully", async () => {
//     // GIVEN
//     const text =
//       "A cat found a shiny pebble in the garden. Curious, it batted the pebble across the yard. " +
//       "The pebble rolled into a hole, and a tiny mouse popped out, squeaking. " +
//       "Surprised but delighted, the cat and mouse became friends.";
//     const question = "What did the cat find?";
//     const answer = "a shiny pebble";

//     // WHEN
//     const result = await checkOpenAnswer(text, question, answer);

//     // THEN
//     expect(result).not.toBeInstanceOf(Error);
//     expect(result).not.toBe(-1);
//     expect(result).toBeGreaterThanOrEqual(0);
//     expect(result).toBeLessThanOrEqual(100);
//     expect(apiCheckOpenAnswer).toHaveBeenCalledWith(text, question, answer);
//   });
// });
