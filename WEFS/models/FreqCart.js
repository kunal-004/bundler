const { Schema, model } = require("mongoose");

const freqCartSchema = new Schema(
  {
    freqProductsCart: {
      type: [
        {
          type: [{ type: String, required: true }],
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const freqCartModel = model("freqCartModel", freqCartSchema);

module.exports = {
  freqCartModel,
};
