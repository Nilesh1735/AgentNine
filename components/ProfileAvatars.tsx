import { MaskedAvatars } from "@/components/ui/masked-avatars";

export function ProfileAvatars({
  size = 88,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <MaskedAvatars
      avatars={[
        { avatar: "/nilesh-profile.jpeg", name: "Nilesh Raj", href: "/about" },
        { avatar: "/ali-sibtain-profile.webp", name: "Ali Sibtain", href: "/about" },
        { avatar: "/armaan-profile.jpeg", name: "Armaan Amba", href: "/about" },
        { avatar: "/ronit-profile.jpeg", name: "Ronit Jaiswal", href: "/about" },
      ]}
      size={size}
      column={Math.round(size * 0.68)}
      movement={0.55}
      className={className}
    />
  );
}
