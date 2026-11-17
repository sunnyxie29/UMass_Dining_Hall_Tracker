import User from "../models/user.js";

export const findByEmail = async (email) => User.findOne({ email }).lean();

export const findById = async (id) => User.findById(id).lean();

export const create = async (data) => (await User.create(data)).toObject();
