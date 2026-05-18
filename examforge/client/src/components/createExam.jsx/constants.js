export const STEPS = ["Basic info", "Questions", "Assign students", "Review"];

export const emptyQ = () => ({
  text: "",
  type: "mcq",
  options: ["", "", "", ""],
  correctIndex: 0,
  marks: 1,
});
