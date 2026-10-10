import { MaskedAvatars } from "@/components/ui/masked-avatars";

const emptyAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3C/svg%3E";

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
        { avatar: "/nilesh-profile.jpeg", name: "Nilesh", href: "/about" },
        { avatar: "/ali-sibtain-profile.webp", name: "Ali", href: "/about" },
        { avatar: "/armaan-profile.jpeg", name: "Arman", href: "/about" },
        { avatar: emptyAvatar, name: "Join us", href: "/join" },
      ]}
      size={size}
      column={Math.round(size * 0.68)}
      movement={0.55}
      className={className}
    />
  );
}
