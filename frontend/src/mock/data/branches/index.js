import { media } from "../../assets/index.js";

/**
 * Physical boutique network. Mirrors the future branches API.
 * openingHours uses ISO weekday keys for easy calendar rendering.
 *
 * `status` (Phase 8) is the platform governance state: "active" branches
 * trade and appear on the storefront; "disabled" branches are hidden from
 * the storefront but never deleted — their history stays attached.
 *
 * `href` is the boutique's published destination. Store detail is the homepage
 * Stores section (there is no per-branch page yet), so it carries the anchor
 * rather than a route nobody serves; `id` remains the stable identity a future
 * `/stores/:id` would resolve.
 */
export const branches = [
  {
    id: "BR-001",
    status: "active",
    name: "Swarnova Bhubaneswar",
    flagship: true,
    city: "Bhubaneswar",
    state: "Odisha",
    address: "Plot 12, Janpath, Unit 3, Bhubaneswar, Odisha 751022",
    phone: "+91 674 200 1234",
    email: "bhubaneswar@swarnova.in",
    openingHours: {
      summary: "Mon – Sun",
      hours: "10:00 AM – 8:30 PM",
    },
    image: {
      src: media.flagshipStore,
      alt: "Warm cream and gold interior of the Swarnova Bhubaneswar flagship boutique",
    },
    directionsUrl: "https://maps.google.com/?q=Swarnova+Bhubaneswar",
    href: "/#stores",
    featured: true,
  },
  {
    id: "BR-002",
    status: "active",
    name: "Swarnova Cuttack",
    flagship: false,
    city: "Cuttack",
    state: "Odisha",
    address: "Badambadi Road, near Chandi Temple, Cuttack, Odisha 753012",
    phone: "+91 671 244 5678",
    email: "cuttack@swarnova.in",
    openingHours: {
      summary: "Mon – Sun",
      hours: "10:30 AM – 8:00 PM",
    },
    image: {
      src: media.boutiqueCuttack,
      alt: "Warm cream marble and gold interior of a Swarnova boutique with glass vitrines",
    },
    directionsUrl: "https://maps.google.com/?q=Swarnova+Cuttack",
    href: "/#stores",
    featured: true,
  },
  {
    id: "BR-003",
    status: "active",
    name: "Swarnova Rourkela",
    flagship: false,
    city: "Rourkela",
    state: "Odisha",
    address: "Civil Township, Main Road, Rourkela, Odisha 769004",
    phone: "+91 661 250 9012",
    email: "rourkela@swarnova.in",
    openingHours: {
      summary: "Mon – Sun",
      hours: "10:00 AM – 8:00 PM",
    },
    image: {
      src: media.boutiqueRourkela,
      alt: "Inviting cream and champagne gold Swarnova boutique interior with display cases",
    },
    directionsUrl: "https://maps.google.com/?q=Swarnova+Rourkela",
    href: "/#stores",
    featured: true,
  },
];

export default branches;
