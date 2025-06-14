const { Schema, model } = require("mongoose");

const cartWarehouseSchema = new Schema(
  {
    cart: {
      type: [
        {
          name: {
            required: true,
            type: String,
          },
          imageUrls: {
            type: [
              {
                required: true,
                type: String,
              },
            ],
            default: [],
          },
          itemId: {
            type: Number,
            required: true,
          },
        },
      ],
    },
    keywords: {
      type: [
        {
          required: true,
          type: String,
        },
      ],
      default: [],
    },
    companyId: {
      type: Number,
      required: true,
    },
    applicationId: {
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

const cartWarehouseModel = model("cartWarehouseModel", cartWarehouseSchema);

module.exports = {
  cartWarehouseModel,
};
