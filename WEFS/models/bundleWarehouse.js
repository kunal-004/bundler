const { Schema, model } = require("mongoose");

const bundleWarehouseSchema = new Schema(
  {
    bundle: {
      type: [
        {
          bundleId: {
            type: String,
            required: true,
          },
          boughtCount: {
            required: true,
            type: Number,
          },
          aiGen: {
            required: true,
            type: Boolean,
          },
        },
      ],
    },
    companyId: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const bundleWarehouseModel = model(
  "bundleWarehouseModel",
  bundleWarehouseSchema
);

module.exports = {
  bundleWarehouseModel,
};
