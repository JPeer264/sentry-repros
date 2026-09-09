export const dynamic = "force-dynamic";

export default function ServerThrowPage() {
  throw new Error("Server component throw");
}
