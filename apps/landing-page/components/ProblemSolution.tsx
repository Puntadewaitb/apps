import { Card, Container, Section } from "@tpl/ui";
import { site } from "../content/site";

export function ProblemSolution() {
  const { problem, solution } = site;
  return (
    <>
      <Section id="masalah" title={problem.title} subtitle={problem.subtitle}>
        <ul className="grid gap-4 md:grid-cols-3">
          {problem.items.map((item) => (
            <li key={item.title}>
              <Card className="h-full">
                <span aria-hidden="true" className="text-3xl">
                  {item.icon}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-fg">{item.title}</h3>
                <p className="mt-2 text-muted">{item.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
      <section id="solusi" className="bg-primary py-12 text-primary-fg sm:py-16">
        <Container className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{solution.title}</h2>
            <p className="mt-3 opacity-90">{solution.text}</p>
          </div>
          <ul className="space-y-3">
            {solution.points.map((p) => (
              <li key={p} className="flex gap-3 rounded-lg bg-white/10 px-4 py-3">
                <span aria-hidden="true">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
