import { Button } from "../components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

function Login() {
  return (
    <div className="px-4 w-full max-w-2xl">
      <form className="border rounded-sm p-2">
        <FieldSet className="pb-4">
          <FieldLegend className="m-auto">Log in</FieldLegend>
          <FieldGroup>
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
            </Field>
          </FieldGroup>
        </FieldSet>
        <Field>
          <Button type="submit" className="py-6">
            Log in
          </Button>
        </Field>
      </form>
    </div>
  );
}

export default Login;
