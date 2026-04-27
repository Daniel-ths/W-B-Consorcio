"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Car,
  Check,
  ChevronRight,
  FileText,
  ImageIcon,
  Menu,
  MessageCircle,
  Search,
} from "lucide-react";

type Step = "versoes" | "motor" | "cor" | "interior" | "resumo";

type Version = {
  id: string;
  name: string;
  price: number;
  fuel: string;
  transmission: string;
  image: string;
};

type Motor = {
  id: string;
  name: string;
  description: string;
  price: number;
  power: string;
  fuel: string;
  transmission: string;
  traction: string;
};

type Color = {
  id: string;
  name: string;
  type: string;
  price: number;
  hex: string;
  image: string;
};

type Interior = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type VehicleConfig = {
  slug: string;
  name: string;
  fullName: string;
  heroImage: string;
  exteriorImage: string;
  interiorImage: string;
  versions: Version[];
  motors: Motor[];
  colors: Color[];
  interiors: Interior[];
};

const VW_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen_logo_2019.svg%20(1).png",

  teraMain:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Tera-Banner-Frente-1920x1080.webp",
  teraExterior:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Tera-Banner-Frente-1920x1080.webp",
  teraInterior: "COLE_AQUI_INTERIOR_TERA",
  teraThumb: "COLE_AQUI_THUMB_TERA",

  tcrossMain:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/t-cross-selecao_banner_desk%20(1).webp",
  tcrossExterior:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/t-cross-selecao_banner_desk%20(1).webp",
  tcrossInterior: "COLE_AQUI_INTERIOR_T_CROSS",
  tcrossThumb: "COLE_AQUI_THUMB_T_CROSS",
};

const vehiclesBuilderConfig: Record<string, VehicleConfig> = {
  tera: {
    slug: "tera",
    name: "Tera",
    fullName: "Tera MPI 1.0 MPI 84 cv Manual de 5 velocidades 4 portas",
    heroImage: VW_IMAGES.teraMain,
    exteriorImage: VW_IMAGES.teraExterior,
    interiorImage: VW_IMAGES.teraInterior,
    versions: [
      {
        id: "tera-1-0-mpi",
        name: "Tera 1.0 MPI",
        price: 107190,
        fuel: "Total Flex",
        transmission: "Manual",
        image: VW_IMAGES.teraThumb,
      },
      {
        id: "tera-170-tsi",
        name: "Tera 170 TSI",
        price: 119990,
        fuel: "Total Flex",
        transmission: "Manual",
        image: VW_IMAGES.teraThumb,
      },
      {
        id: "tera-comfort",
        name: "Tera Comfort",
        price: 129990,
        fuel: "Total Flex",
        transmission: "Automático",
        image: VW_IMAGES.teraThumb,
      },
      {
        id: "tera-high",
        name: "Tera High",
        price: 139990,
        fuel: "Total Flex",
        transmission: "Automático",
        image: VW_IMAGES.teraThumb,
      },
    ],
    motors: [
      {
        id: "1-0-mpi-manual",
        name: "1.0 MPI",
        description: "Manual de 5 velocidades",
        price: 107190,
        power: "84 cv",
        fuel: "Total Flex",
        transmission: "Manual",
        traction: "Tração dianteira",
      },
    ],
    colors: [
      {
        id: "azul",
        name: "Azul Turbo",
        type: "Metálica",
        price: 1590,
        hex: "#006b94",
        image: VW_IMAGES.teraExterior,
      },
      {
        id: "cinza",
        name: "Cinza Platinum",
        type: "Metálica",
        price: 1590,
        hex: "#6d747a",
        image: VW_IMAGES.teraExterior,
      },
      {
        id: "prata",
        name: "Prata Sirius",
        type: "Metálica",
        price: 1590,
        hex: "#bfc4c7",
        image: VW_IMAGES.teraExterior,
      },
      {
        id: "vermelho",
        name: "Vermelho Hypernova",
        type: "Metálica",
        price: 1590,
        hex: "#ba0000",
        image: VW_IMAGES.teraExterior,
      },
      {
        id: "branco",
        name: "Branco Cristal",
        type: "Sólida",
        price: 0,
        hex: "#efefec",
        image: VW_IMAGES.teraExterior,
      },
      {
        id: "preto",
        name: "Preto Ninja",
        type: "Sólida",
        price: 0,
        hex: "#050505",
        image: VW_IMAGES.teraExterior,
      },
    ],
    interiors: [
      {
        id: "tecido",
        name: "Revestimento em tecido",
        price: 0,
        image: VW_IMAGES.teraInterior,
      },
    ],
  },

  "t-cross": {
    slug: "t-cross",
    name: "T-Cross",
    fullName: "T-Cross 200 TSI Total Flex Automático",
    heroImage: VW_IMAGES.tcrossMain,
    exteriorImage: VW_IMAGES.tcrossExterior,
    interiorImage: VW_IMAGES.tcrossInterior,
    versions: [
      {
        id: "t-cross-200-tsi",
        name: "T-Cross 200 TSI",
        price: 149990,
        fuel: "Total Flex",
        transmission: "Automático",
        image: VW_IMAGES.tcrossThumb,
      },
    ],
    motors: [
      {
        id: "200-tsi-auto",
        name: "200 TSI",
        description: "Automático de 6 velocidades",
        price: 149990,
        power: "128 cv",
        fuel: "Total Flex",
        transmission: "Automático",
        traction: "Tração dianteira",
      },
    ],
    colors: [
      {
        id: "azul",
        name: "Azul Norway",
        type: "Metálica",
        price: 1590,
        hex: "#005a85",
        image: VW_IMAGES.tcrossExterior,
      },
      {
        id: "preto",
        name: "Preto Ninja",
        type: "Sólida",
        price: 0,
        hex: "#050505",
        image: VW_IMAGES.tcrossExterior,
      },
    ],
    interiors: [
      {
        id: "tecido",
        name: "Revestimento em tecido",
        price: 0,
        image: VW_IMAGES.tcrossInterior,
      },
    ],
  },
};

function money(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function VolkswagenBuilderPage() {
  const searchParams = useSearchParams();
  const vehicleSlug = searchParams.get("vehicle") || "tera";

  const vehicle =
    vehiclesBuilderConfig[vehicleSlug] || vehiclesBuilderConfig.tera;

  const [step, setStep] = useState<Step>("versoes");
  const [selectedVersion, setSelectedVersion] = useState(vehicle.versions[0]);
  const [selectedMotor, setSelectedMotor] = useState(vehicle.motors[0]);
  const [selectedColor, setSelectedColor] = useState(vehicle.colors[5] || vehicle.colors[0]);
  const [selectedInterior, setSelectedInterior] = useState(vehicle.interiors[0]);

  const total =
    selectedVersion.price +
    selectedColor.price +
    selectedInterior.price;

  const currentImage = useMemo(() => {
    if (step === "interior") return vehicle.interiorImage;
    if (step === "resumo") return selectedColor.image;
    return selectedColor.image || vehicle.heroImage;
  }, [step, vehicle, selectedColor]);

  const goNext = () => {
    if (step === "versoes") return setStep("motor");
    if (step === "motor") return setStep("cor");
    if (step === "cor") return setStep("interior");
    if (step === "interior") return setStep("resumo");
  };

  const nextLabel =
    step === "versoes"
      ? "Motor e Transmissão"
      : step === "motor"
      ? "Cores"
      : step === "cor"
      ? "Interior"
      : step === "interior"
      ? "Resumo"
      : "Tenho Interesse";

  return (
    <main className="min-h-screen bg-white text-[#001e50]">
      <header className="fixed left-0 top-0 z-[80] h-[46px] w-full border-b border-black/10 bg-white text-[#001e50]">
        <div className="flex h-full items-center justify-between px-[76px]">
          <div className="flex h-full items-center gap-6">
            <img src={VW_IMAGES.logo} alt="Volkswagen" className="h-[24px] w-auto" />
            <Link href="/volkswagen" className="text-[13px] font-bold">Menu</Link>
            <Link href="/volkswagen" className="text-[13px] font-bold">
              Configure seu novo Volkswagen
            </Link>
            <Link href="/volkswagen" className="text-[13px] font-bold">
              Conheça nossas ofertas
            </Link>
            <Link href="/volkswagen" className="text-[13px] font-bold">
              Serviços e Pós-vendas
            </Link>
          </div>

          <Search className="h-5 w-5" />
        </div>
      </header>

      <nav className="fixed left-0 top-[46px] z-[75] h-[42px] w-full border-b border-black/10 bg-white">
        <div className="flex h-full items-center gap-8 px-[76px] text-[13px]">
          <Link href="/volkswagen">Ver modelos</Link>

          {[
            ["versoes", "Versões"],
            ["motor", "Motor e Transmissão"],
            ["cor", "Escolha a cor"],
            ["interior", "Acabamento interno"],
            ["resumo", "Ir para o resumo"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStep(key as Step)}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                step === key ? "bg-[#001e50] text-white" : "text-[#001e50]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <section className="grid min-h-screen grid-cols-[1fr_420px] pt-[88px]">
        <div className="relative overflow-hidden bg-[#f4f4f4]">
          {step !== "resumo" ? (
            <>
              <img
                key={`${step}-${currentImage}`}
                src={currentImage}
                alt={vehicle.name}
                className="builder-vw-image h-[calc(100vh-138px)] w-full object-cover"
              />

              <button className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow">
                ‹
              </button>

              <button className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow">
                ›
              </button>

              <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-3 rounded-full bg-white px-5 py-2">
                {[1, 2, 3, 4, 5, 6].map((dot) => (
                  <span
                    key={dot}
                    className={`h-2 w-2 rounded-full ${
                      dot === 1 ? "bg-[#001e50]" : "bg-[#001e50]/35"
                    }`}
                  />
                ))}
              </div>

              <div className="absolute bottom-8 right-8 flex gap-2 rounded-md bg-white px-3 py-2">
                <ImageIcon className="h-5 w-5" />
                <Car className="h-5 w-5" />
              </div>
            </>
          ) : (
            <div className="mx-auto grid max-w-[1120px] grid-cols-[1fr_360px] gap-8 px-10 py-8">
              <div>
                <img
                  src={currentImage}
                  alt={vehicle.name}
                  className="h-[430px] w-full object-cover"
                />

                <p className="mt-3 text-[13px]">{vehicle.fullName}</p>

                <h1 className="mt-6 text-[36px] font-bold">Resumo</h1>

                <div className="mt-6 flex gap-8 border-b border-black/20 text-[14px]">
                  <button className="border-b-2 border-[#001e50] pb-3">
                    Configuração selecionada
                  </button>
                  <button className="pb-3">Equipamentos de série</button>
                  <button className="pb-3">Dados técnicos</button>
                </div>

                <SummaryBox
                  title="1. Motor selecionado"
                  main={selectedMotor.name}
                  sub={selectedMotor.description}
                  right={`Preço ${money(total)} Preço Total`}
                  footer={`Potência ${selectedMotor.power}`}
                />

                <SummaryBox
                  title="2. Exterior selecionado"
                  main={selectedColor.name}
                  sub={selectedColor.price === 0 ? "Sem custos adicionais" : money(selectedColor.price)}
                  right=""
                  footer=""
                  color={selectedColor.hex}
                />

                <SummaryBox
                  title="3. Interior selecionado"
                  main={selectedInterior.name}
                  sub={
                    selectedInterior.price === 0
                      ? "Sem custos adicionais"
                      : money(selectedInterior.price)
                  }
                  right=""
                  footer=""
                />
              </div>

              <div className="h-fit bg-[#f3f3f3] p-8">
                <p className="text-center text-[13px] font-bold">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h2 className="mt-2 text-center text-[30px] font-bold">Resumo</h2>

                <div className="mt-8 border-b border-black/10 pb-5">
                  <div className="flex justify-between text-[14px]">
                    <span>Preço Preço Total</span>
                    <strong>{money(total)}</strong>
                  </div>
                </div>

                <button className="mt-8 h-[46px] w-full rounded-full bg-[#001e50] text-[14px] font-bold text-white">
                  Tenho Interesse
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== "resumo" && (
          <aside className="border-l border-black/10 bg-white px-8 py-8">
            {step === "versoes" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold">{vehicle.name}</p>
                    <h1 className="text-[34px] font-bold">
                      {vehicle.versions.length} versões
                    </h1>
                  </div>
                  <button className="rounded-full border border-[#001e50] px-4 py-2 text-[13px]">
                    ≡ Filtros
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {vehicle.versions.map((version) => {
                    const active = selectedVersion.id === version.id;

                    return (
                      <button
                        key={version.id}
                        onClick={() => {
                          setSelectedVersion(version);
                          setSelectedMotor(vehicle.motors[0]);
                        }}
                        className={`w-full rounded-md border p-5 text-left transition ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                      >
                        <div className="flex justify-between">
                          <h3 className="text-[18px] font-bold">{version.name}</h3>
                          {active ? (
                            <Check className="h-5 w-5 rounded-full bg-[#159447] text-white" />
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[12px]">
                              i
                            </span>
                          )}
                        </div>

                        <p className="mt-6 text-[12px] font-bold">
                          MOTORIZAÇÃO (1 disponível)
                        </p>

                        <div className="mt-2 flex gap-2 text-[12px]">
                          <span className="bg-[#eef2f5] px-2 py-1">{version.fuel}</span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {version.transmission}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === "motor" && (
              <>
                <p className="text-[14px]">{vehicle.fullName}</p>
                <p className="mt-8 text-[14px] font-bold">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h1 className="text-[34px] font-bold">1 Motor</h1>

                <div className="mt-4 flex gap-6 text-[14px] underline">
                  <button>Equipamentos de série</button>
                  <button>Dados técnicos</button>
                </div>

                <div className="mt-6 space-y-4">
                  {vehicle.motors.map((motor) => {
                    const active = selectedMotor.id === motor.id;

                    return (
                      <button
                        key={motor.id}
                        onClick={() => setSelectedMotor(motor)}
                        className={`w-full rounded-md border p-5 text-left ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                      >
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-[17px] font-bold">{motor.name}</h3>
                            <p className="mt-1">{motor.description}</p>
                          </div>

                          {active && (
                            <Check className="h-5 w-5 rounded-full bg-[#159447] text-white" />
                          )}
                        </div>

                        <div className="mt-4 flex gap-2 text-[12px]">
                          <span className="bg-[#eef2f5] px-2 py-1">{motor.fuel}</span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {motor.transmission}
                          </span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {motor.traction}
                          </span>
                        </div>

                        <div className="mt-5 border-t border-black/10 pt-4">
                          <p>Preço Preço Total</p>
                          <strong>{money(total)}</strong>
                        </div>

                        <div className="mt-5 flex justify-between">
                          <span>Potência</span>
                          <strong>{motor.power}</strong>
                        </div>

                        <button className="mt-5 underline">Mais informação</button>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === "cor" && (
              <>
                <p className="text-[14px]">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h1 className="text-[34px] font-bold">6 Exterior</h1>

                <div className="mt-4 flex gap-6 text-[14px] underline">
                  <button>Equipamentos de série</button>
                  <button>Dados técnicos</button>
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-[14px]">Metálica</p>
                  <div className="flex flex-wrap gap-3">
                    {vehicle.colors
                      .filter((color) => color.type === "Metálica")
                      .map((color) => (
                        <ColorButton
                          key={color.id}
                          color={color}
                          active={selectedColor.id === color.id}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                  </div>

                  <p className="mb-3 mt-8 text-[14px]">Sólida</p>
                  <div className="flex flex-wrap gap-3">
                    {vehicle.colors
                      .filter((color) => color.type === "Sólida")
                      .map((color) => (
                        <ColorButton
                          key={color.id}
                          color={color}
                          active={selectedColor.id === color.id}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                  </div>

                  <div className="mt-8 rounded-md border border-[#159447] p-5">
                    <h3 className="font-bold">{selectedColor.name}</h3>
                    <p className="mt-4 text-[13px] font-bold">
                      {selectedColor.price === 0
                        ? "Sem custos adicionais"
                        : money(selectedColor.price)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {step === "interior" && (
              <>
                <p className="text-[14px]">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h1 className="text-[34px] font-bold">1 Interior</h1>

                <div className="mt-4 flex gap-6 text-[14px] underline">
                  <button>Equipamentos de série</button>
                  <button>Dados técnicos</button>
                </div>

                <p className="mt-8 text-[15px] font-bold">Acabamento interno</p>

                <div className="mt-4 space-y-4">
                  {vehicle.interiors.map((interior) => {
                    const active = selectedInterior.id === interior.id;

                    return (
                      <button
                        key={interior.id}
                        onClick={() => setSelectedInterior(interior)}
                        className={`w-full overflow-hidden rounded-md border text-left ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                      >
                        <img
                          src={interior.image}
                          alt={interior.name}
                          className="h-[130px] w-full object-cover"
                        />

                        <div className="flex items-center justify-between p-4">
                          <strong>{interior.name}</strong>
                          {active && (
                            <Check className="h-5 w-5 rounded-full bg-[#159447] text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </aside>
        )}
      </section>

      {step !== "resumo" && (
        <div className="fixed bottom-0 left-0 z-[90] flex h-[58px] w-full items-center justify-between border-t border-black/10 bg-white px-[76px]">
          <div>
            <p className="text-[12px]">Preço Preço Total</p>
            <strong>{money(total)}</strong>
          </div>

          <button
            onClick={goNext}
            className="flex h-[42px] items-center gap-2 rounded-full bg-[#0055d8] px-8 text-[14px] font-bold text-white shadow-lg"
          >
            {nextLabel}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <a
        href="#"
        className="fixed bottom-[12px] left-3 z-[100] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#22d366] text-white shadow-xl"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      <div className="fixed right-0 top-[170px] z-[100] hidden flex-col md:flex">
        <button className="flex h-[48px] w-[42px] items-center justify-center rounded-l-md bg-[#004a98] text-white">
          ♿
        </button>
        <button className="mt-[2px] flex h-[48px] w-[42px] items-center justify-center rounded-l-md bg-[#004a98] text-white">
          🖐️
        </button>
      </div>

      <style jsx global>{`
        .builder-vw-image {
          animation: builderVwImage 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes builderVwImage {
          from {
            opacity: 0;
            transform: scale(1.015);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}

function ColorButton({
  color,
  active,
  onClick,
}: {
  color: Color;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 ${
        active ? "border-[#159447]" : "border-black/20"
      }`}
    >
      <span
        className="h-[48px] w-[48px] rounded-full border border-black/10"
        style={{ background: color.hex }}
      />
      {active && (
        <Check className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#159447] text-white" />
      )}
    </button>
  );
}

function SummaryBox({
  title,
  main,
  sub,
  right,
  footer,
  color,
}: {
  title: string;
  main: string;
  sub: string;
  right: string;
  footer: string;
  color?: string;
}) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-[17px] font-bold">{title}</h3>

      <div className="rounded-md border border-[#159447] p-5">
        <div className="flex items-center justify-between">
          <div>
            <strong>{main}</strong>
            <p className="mt-2 text-[14px]">{sub}</p>
          </div>

          {color ? (
            <span
              className="h-[58px] w-[58px] rounded-full border border-black/20"
              style={{ background: color }}
            />
          ) : (
            <strong>{right}</strong>
          )}
        </div>

        {footer && (
          <div className="mt-5 border-t border-black/10 pt-4 text-[14px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}