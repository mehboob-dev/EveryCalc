export interface CalculatorModule {
  id: string;
  name: string;
  icon: string;
  render(container: HTMLElement): void;
  destroy?(): void;
}
