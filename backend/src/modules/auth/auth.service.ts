import bcrypt from "bcrypt";
import User from "../../database/models/user.model";

class AuthService {
  async register(name: string, email: string, password: string) {
    
    email = email.toLowerCase();
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return {
      id: user.getDataValue("id"),
      name: user.getDataValue("name"),
      email: user.getDataValue("email"),
    };
  }
}

export default new AuthService();