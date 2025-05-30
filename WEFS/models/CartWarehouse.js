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

// {
// 		email: {
// 			required: true,
// 			type: String,
// 			unique: true,
// 			validate: {
// 				validator: function (value: string) {
// 					return userEmailRegex.test(value);
// 				},
// 				message: "Invalid email format",
// 			},
// 		},
// 		password: {
// 			required: true,
// 			type: String,
// 		},
// 		accType: {
// 			type: String,
// 			required: true,
// 			enum: Object.values(AccountType),
// 		},
// 		position: {
// 			type: [
// 				{
// 					type: String,
// 					required: true,
// 					enum: Object.values(AdminPosition),
// 				},
// 			],
// 			default: [],
// 		},
// 		postsLiked: {
// 			type: [
// 				{
// 					type: Schema.Types.ObjectId,
// 					ref: "postModel",
// 				},
// 			],
// 			default: [],
// 		},
