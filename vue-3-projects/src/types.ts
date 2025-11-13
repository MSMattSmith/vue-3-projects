export interface Recipe {
    recipeName: string;
    ingredients: Ingredient[];
    steps: Step[];
}

export interface Ingredient {
    name: string;
    quantity: string;
}

export interface Step {
    number: number;
    description: string;
}
