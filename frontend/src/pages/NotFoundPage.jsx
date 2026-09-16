import Container from "../components/ui/Container.jsx";
import Button from "../components/ui/Button.jsx";

/**
 * Application-level fallback for any route that does not exist yet. It renders
 * inside whichever layout owns the route group it is reached through.
 */
export default function NotFoundPage() {
  return (
    <Container className="pb-20 pt-[160px] text-center">
      <p className="eyebrow eyebrow-light">Page Not Found</p>
      <h1 className="mt-5 font-serif text-[34px] leading-tight text-ink sm:text-[42px]">
        This experience opens in a later phase
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-ash">
        The page you asked for is not part of the storefront yet. Collections,
        product pages, AI Studio, Virtual Try-On, cart and account arrive in
        their own phases.
      </p>
      <div className="mt-9">
        <Button href="/">Return to the Storefront</Button>
      </div>
    </Container>
  );
}
