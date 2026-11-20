interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "h-9 w-9" }: LogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 2.8 39.4 12.9v18.2L22 41.2 4.6 31.1V12.9L22 2.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M22 8.2 34.7 15.5v13L22 35.8 9.3 28.5v-13L22 8.2Z"
        fill="currentColor"
        fillOpacity=".08"
        stroke="currentColor"
        strokeOpacity=".38"
        strokeWidth="1"
      />
      <path
        d="M22 12.5v7.2m0 4.6v7.2M12.5 22h7.2m4.6 0h7.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="22" r="3.2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="22" cy="22" r="1.2" fill="currentColor" />
    </svg>
  );
}
