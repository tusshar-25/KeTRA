import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-sm text-slate-400">
          Please login to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-slate-400 mt-1">
          Account information and overview
        </p>
      </div>

      {/* PROFILE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="
          rounded-2xl
          border border-slate-800
          bg-slate-900/40
          p-6
          space-y-6
        "
      >
        {/* BASIC INFO */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Role</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Available Balance</p>
            <p className="font-medium">
              ₹{user.balance?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* META */}
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Account created and managed through keTRA.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
