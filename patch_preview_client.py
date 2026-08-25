with open(".storybook/preview.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "import { SorokitProvider } from '../src/context/SorokitProvider';",
    "import { SorokitProvider } from '../src/context/SorokitProvider';\nimport { initClient } from '../src/lib/client';"
)

content = content.replace(
    "} as any;",
    "} as any;\n\ninitClient(mockClient);"
)

with open(".storybook/preview.tsx", "w") as f:
    f.write(content)
