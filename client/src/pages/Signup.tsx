import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

function Signup() {
  return (
    <div className="px-4 w-full max-w-2xl">
      <form className="border rounded-sm p-2">
        <FieldSet className="pb-4">
          <FieldLegend className="m-auto">Sign Up</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="firstName">First Name</FieldLabel>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="John"
                autoComplete="given-name"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Doe"
                autoComplete="family-name"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="john.doe@gmail.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="********"
                required
              />
              <FieldDescription>
                Password must have at least 6 characters
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>
        <Field>
          <Button type="submit" className="py-6">
            Sign Up
          </Button>
        </Field>
      </form>
    </div>
  );
}

export default Signup;
