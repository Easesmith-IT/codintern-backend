exports.authorize = (moduleName, accessType = "read") => {
  return (req, res, next) => {
    const { user } = req;
    if (!user?.role) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    console.log("user", user);
    console.log("moduleName", moduleName);
    console.log("accessType", accessType);
    

    if (user.role === "superAdmin") return next();

    const level = user.permissions?.[moduleName];
    if (!level || level === "none") {
      return res.status(403).json({
        status: "error",
        message: `No permission for ${moduleName}`,
      });
    }

    const canProceed =
      (accessType === "read" && (level === "read" || level === "read&write")) ||
      (accessType === "read&write" && level === "read&write");

    if (!canProceed) {
      return res.status(403).json({
        status: "error",
        message: `You need ${accessType} access to ${moduleName}`,
      });
    }

    next();
  };
};
