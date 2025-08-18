import logoSvg from "@/assets/kpro-logo.svg";

interface KProLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const KProLogo = ({ className = "", size = "md" }: KProLogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSvg} 
        alt="KPro" 
        className={`${sizeClasses[size]} w-auto`}
      />
    </div>
  );
};

export default KProLogo;